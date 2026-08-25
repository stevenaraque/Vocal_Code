from django.db import models
from django.conf import settings


class VoiceCommand(models.Model):
    CATEGORY_CHOICES = [
        ('structure', 'Estructuras'),
        ('navigation', 'Navegación'),
        ('editing', 'Edición'),
        ('execution', 'Ejecución'),
    ]

    trigger = models.CharField(max_length=100, unique=True)
    templates = models.JSONField(default=dict, help_text='{"python": "...", "javascript": "...", "csharp": "..."}')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    priority = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'voice_commands'
        ordering = ['-priority', 'trigger']
        verbose_name = 'Comando de Voz'
        verbose_name_plural = 'Comandos de Voz'

    def __str__(self):
        return self.trigger


class CommandHistory(models.Model):
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='command_history')
    command = models.ForeignKey(VoiceCommand, on_delete=models.SET_NULL, null=True, blank=True)
    recognized_text = models.CharField(max_length=500)
    template_inserted = models.TextField(blank=True, default='')
    position_before = models.IntegerField(default=0)
    position_after = models.IntegerField(default=0)
    source = models.CharField(max_length=10, choices=[('dict', 'Diccionario'), ('ai', 'IA')], default='dict')
    latency_ms = models.IntegerField(default=0)
    success = models.BooleanField(default=True)
    undone = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'command_history'
        ordering = ['-created_at']
        verbose_name = 'Historial de Comando'
        verbose_name_plural = 'Historial de Comandos'

    def __str__(self):
        return f'{self.project} - {self.recognized_text[:50]}'