#include <libwebsockets.h>
#include <string.h>

static int callback_echo(struct lws *wsi, enum lws_callback_reasons reason,
                         void *user, void *in, size_t len) {
   switch (reason) {
      case LWS_CALLBACK_RECEIVE:
         // Echo received message back to the client
         lws_write(wsi, (unsigned char *)in, len, LWS_WRITE_TEXT);
         break;
      default:
         break;
   }
   return 0;
}

static struct lws_protocols protocols[] = {
   { "http-only", callback_echo, 0, 0 },
   { NULL, NULL, 0, 0 }
};

int main(void) {
   struct lws_context_creation_info info;
   struct lws_context *context;

   memset(&info, 0, sizeof info);
   info.port = 8080;
   info.protocols = protocols;

   context = lws_create_context(&info);
   if (!context) {
      return 1;
   }

   while (1) {
      lws_service(context, 1000);
   }

   lws_context_destroy(context);
   return 0;
}
