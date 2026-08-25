from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VoiceCommandViewSet, CommandHistoryViewSet

router = DefaultRouter()
router.register(r'commands', VoiceCommandViewSet, basename='voice-command')
router.register(r'history', CommandHistoryViewSet, basename='command-history')

urlpatterns = [
    path('', include(router.urls)),
]