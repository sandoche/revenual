# Virtual Host

## Apache virtual host revenual.example.com.conf

```
<VirtualHost *:80>
    ServerName revenual.example.com

    ProxyRequests Off
    ProxyPreserveHost On
    ProxyVia Full

    <Proxy *>
        Require all granted
    </Proxy>

    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
RewriteEngine on
RewriteCond %{SERVER_NAME} =revenual.example.com
RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>
```

## For SSL
* Run let's encrypt script