from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
import branchchat.routing
import notifications.routing

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter([
            branchchat.routing.websocket_urlpatterns[0],
            notifications.routing.websocket_urlpatterns[0],
        ]),
    )
})