from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db.models import Q

from .models import VoiceCommand, CommandHistory
from .serializers import VoiceCommandSerializer, VoiceCommandListSerializer, CommandHistorySerializer


class VoiceCommandViewSet(viewsets.ModelViewSet):
    queryset = VoiceCommand.objects.filter(is_active=True)
    serializer_class = VoiceCommandSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return VoiceCommandListSerializer
        return VoiceCommandSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def by_language(self, request):
        language = request.query_params.get('language', 'python')
        commands = self.get_queryset()
        data = [
            {
                'trigger': cmd.trigger,
                'template': cmd.templates.get(language, ''),
                'category': cmd.category,
            }
            for cmd in commands
        ]
        return Response(data)


class CommandHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CommandHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CommandHistory.objects.filter(project__owner=self.request.user)

    @action(detail=False, methods=['post'])
    def undo_last(self, request):
        project_id = request.data.get('project_id')
        if not project_id:
            return Response({'detail': 'project_id requerido'}, status=status.HTTP_400_BAD_REQUEST)
        last = self.get_queryset().filter(project_id=project_id, undone=False).first()
        if not last:
            return Response({'detail': 'No hay comandos para deshacer'}, status=status.HTTP_404_NOT_FOUND)
        last.undone = True
        last.save()
        return Response(CommandHistorySerializer(last).data)