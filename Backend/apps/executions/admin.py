from django.contrib import admin
from .models import ExecutionLog


@admin.register(ExecutionLog)
class ExecutionLogAdmin(admin.ModelAdmin):
    list_display = ('project', 'language', 'status', 'exit_code', 'duration_ms', 'created_at')
    list_filter = ('language', 'status', 'created_at')
    search_fields = ('project__name', 'code', 'error')
    readonly_fields = ('created_at', 'output', 'error', 'exit_code', 'duration_ms', 'status')
    raw_id_fields = ('project',)