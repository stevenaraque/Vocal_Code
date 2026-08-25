import re
import subprocess
import docker
import time
import sys
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.conf import settings
from asgiref.sync import async_to_sync

# Optional channels import for WebSocket notifications
try:
    from channels.layers import get_channel_layer
    CHANNELS_AVAILABLE = True
except ImportError:
    get_channel_layer = None
    CHANNELS_AVAILABLE = False

# resource module is Unix-only, handle Windows gracefully
if sys.platform != 'win32':
    import resource
else:
    resource = None

from .models import ExecutionLog
from .serializers import ExecutionLogSerializer, ExecutionCreateSerializer
from apps.projects.models import Project


class ExecutionViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ExecutionLogSerializer

    def create(self, request):
        serializer = ExecutionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project_id = serializer.validated_data['project_id']
        code = serializer.validated_data['code']
        language = serializer.validated_data['language']

        try:
            project = Project.objects.get(id=project_id, owner=request.user, is_active=True)
        except Project.DoesNotExist:
            return Response({'detail': 'Proyecto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if project.language != language:
            return Response({'detail': 'El lenguaje no coincide con el proyecto'}, status=status.HTTP_400_BAD_REQUEST)

        security_error = self._check_security(code, language)
        if security_error:
            log = ExecutionLog.objects.create(
                project=project,
                language=language,
                code=code,
                status='security_blocked',
                error=security_error,
            )
            return Response(ExecutionLogSerializer(log).data, status=status.HTTP_400_BAD_REQUEST)

        log = ExecutionLog.objects.create(
            project=project,
            language=language,
            code=code,
            status='running',
        )

        transaction.on_commit(lambda: self._execute_async(log.id, code, language))

        return Response(ExecutionLogSerializer(log).data, status=status.HTTP_202_ACCEPTED)

    def _check_security(self, code, language):
        if language == 'python':
            patterns = [
                r'import\s+os', r'import\s+subprocess', r'import\s+sys',
                r'from\s+os\s+import', r'from\s+subprocess\s+import',
                r'__import__', r'eval\s*\(', r'exec\s*\(',
                r'open\s*\(', r'file\s*\(', r'input\s*\(',
            ]
        else:
            patterns = [
                r'require\s*\(\s*[\'"]fs[\'"]', r'require\s*\(\s*[\'"]child_process[\'"]',
                r'require\s*\(\s*[\'"]net[\'"]', r'require\s*\(\s*[\'"]http[\'"]',
                r'require\s*\(\s*[\'"]https[\'"]', r'process\s*\.',
                r'eval\s*\(', r'Function\s*\(', r'new\s+Function',
            ]
        for pattern in patterns:
            if re.search(pattern, code):
                return f'Código bloqueado: patrón no permitido detectado ({pattern})'
        return None

    def _execute_async(self, log_id, code, language):
        try:
            log = ExecutionLog.objects.get(id=log_id)
            start = time.time()
            channel_layer = get_channel_layer() if CHANNELS_AVAILABLE and get_channel_layer else None

            if language == 'python':
                result = self._execute_python(code, log, channel_layer)
            else:
                result = self._execute_javascript(code, log, channel_layer)

            duration = int((time.time() - start) * 1000)
            log.duration_ms = duration
            log.output = result.get('output', '')
            log.error = result.get('error', '')
            log.exit_code = result.get('exit_code')
            log.status = result.get('status', 'success')
            log.save()

            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f'project_{log.project_id}',
                    {
                        'type': 'send_execution_complete',
                        'output': log.output,
                        'error': log.error,
                        'exit_code': log.exit_code,
                    }
                )
        except Exception as e:
            log = ExecutionLog.objects.get(id=log_id)
            log.status = 'error'
            log.error = str(e)
            log.save()

    def _execute_python(self, code, log, channel_layer):
        def set_limits():
            if resource and sys.platform != 'win32':
                resource.setrlimit(resource.RLIMIT_CPU, (10, 10))
                resource.setrlimit(resource.RLIMIT_AS, 128 * 1024 * 1024)
                resource.setrlimit(resource.RLIMIT_FSIZE, 1024 * 1024)
                resource.setrlimit(resource.RLIMIT_NPROC, 50)

        try:
            # On Windows, python3 may not be in PATH, use sys.executable
            python_cmd = [sys.executable, '-c', code]
            kwargs = {
                'stdout': subprocess.PIPE,
                'stderr': subprocess.PIPE,
                'text': True,
            }
            if sys.platform != 'win32' and resource:
                kwargs['preexec_fn'] = set_limits

            process = subprocess.Popen(python_cmd, **kwargs)
            stdout, stderr = process.communicate(timeout=10)
            return {
                'output': stdout,
                'error': stderr,
                'exit_code': process.returncode,
                'status': 'success' if process.returncode == 0 else 'error',
            }
        except subprocess.TimeoutExpired:
            return {'output': '', 'error': 'Timeout: ejecución superó 10 segundos', 'exit_code': -1, 'status': 'timeout'}
        except Exception as e:
            return {'output': '', 'error': str(e), 'exit_code': -1, 'status': 'error'}

    def _execute_javascript(self, code, log, channel_layer):
        try:
            client = docker.from_env()
            container = client.containers.run(
                'node:alpine',
                f'node -e "{code.replace(chr(34), chr(92)+chr(34))}"',
                remove=True,
                mem_limit='128m',
                cpu_quota=50000,
                cpu_period=100000,
                network_mode='none',
                read_only=True,
                tmpfs={'/tmp': 'exec,size=10m'},
                user='1000:1000',
                detach=True,
            )
            result = container.wait(timeout=10)
            stdout = container.logs(stdout=True, stderr=False).decode()
            stderr = container.logs(stdout=False, stderr=True).decode()
            exit_code = result.get('StatusCode', -1)
            return {
                'output': stdout,
                'error': stderr,
                'exit_code': exit_code,
                'status': 'success' if exit_code == 0 else 'error',
            }
        except Exception as e:
            return {'output': '', 'error': str(e), 'exit_code': -1, 'status': 'error'}

    @action(detail=False, methods=['get'])
    def history(self, request):
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response({'detail': 'project_id requerido'}, status=status.HTTP_400_BAD_REQUEST)
        logs = ExecutionLog.objects.filter(project_id=project_id, project__owner=request.user)
        return Response(ExecutionLogSerializer(logs, many=True).data)