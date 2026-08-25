from rest_framework import serializers
from .models import ExecutionLog


class ExecutionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExecutionLog
        fields = '__all__'
        read_only_fields = ('created_at', 'output', 'error', 'exit_code', 'duration_ms', 'status')


class ExecutionCreateSerializer(serializers.Serializer):
    project_id = serializers.UUIDField()
    code = serializers.CharField()
    language = serializers.ChoiceField(choices=[('python', 'Python'), ('javascript', 'JavaScript')])