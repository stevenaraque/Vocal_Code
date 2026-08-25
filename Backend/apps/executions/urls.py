from django.urls import path
from .views import ExecutionViewSet

urlpatterns = [
    path('', ExecutionViewSet.as_view({'post': 'create'}), name='execute'),
    path('history/', ExecutionViewSet.as_view({'get': 'history'}), name='execution-history'),
]