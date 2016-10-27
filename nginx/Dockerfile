FROM nginx:1.9
MAINTAINER Simon Fan <sf@habem.us>

COPY ./nginx.conf /etc/nginx/nginx.conf

RUN ["mkdir", "-p", "/data/www-error"]
COPY ./www-error /data/www-error