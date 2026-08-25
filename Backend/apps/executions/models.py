from django.db import models
from django.conf import settings


class ExecutionLog(models.Model):
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='executions')
    language = models.CharField(max_length=20, choices=[('python', 'Python'), ('javascript', 'JavaScript')])
    code = models.TextField()
    output = models.TextField(blank=True, default='')
    error = models.TextField(blank=True, default='')
    exit_code = models.IntegerField(null=True, blank=True)
    duration_ms = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pendiente'),
        ('running', 'Ejecutando'),
        ('success', 'Éxito'),
        ('error', 'Error'),
        ('timeout', 'Timeout'),
        ('security_blocked', 'Bloqueado por seguridad'),
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'execution_logs'
        ordering = ['-created_at']
        verbose_name = 'Log de Ejecución'
        verbose_name_plural = 'Logs de Ejecución'

    def __str__(self):
        return f'{self.project} - {self.language} - {self.status}'