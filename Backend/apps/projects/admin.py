from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'language', 'is_active', 'created_at', 'updated_at')
    list_filter = ('language', 'is_active', 'created_at')
    search_fields = ('name', 'owner__email', 'owner__username')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('owner',)