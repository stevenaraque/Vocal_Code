from rest_framework import serializers
from .models import VoiceCommand, CommandHistory


class VoiceCommandSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceCommand
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class VoiceCommandListSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceCommand
        fields = ('id', 'trigger', 'templates', 'category', 'is_active')


class CommandHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CommandHistory
        fields = '__all__'
        read_only_fields = ('created_at',)