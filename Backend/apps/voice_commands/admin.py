from django.contrib import admin
from .models import VoiceCommand, CommandHistory


@admin.register(VoiceCommand)
class VoiceCommandAdmin(admin.ModelAdmin):
    list_display = ('trigger', 'category', 'is_active', 'priority', 'updated_at')
    list_filter = ('category', 'is_active')
    list_editable = ('is_active', 'priority')
    search_fields = ('trigger',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {'fields': ('trigger', 'category', 'is_active', 'priority')}),
        ('Plantillas por Lenguaje', {'fields': ('templates',)}),
        ('Fechas', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(CommandHistory)
class CommandHistoryAdmin(admin.ModelAdmin):
    list_display = ('project', 'recognized_text', 'source', 'success', 'created_at')
    list_filter = ('source', 'success', 'created_at')
    search_fields = ('recognized_text', 'project__name')
    readonly_fields = ('created_at',)
    raw_id_fields = ('project', 'command')