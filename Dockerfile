FROM nginx:alpine

# Copy the snake game files to the nginx html directory
COPY snake-game.html /usr/share/nginx/html/index.html
COPY style.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/

# Expose port 8000
EXPOSE 8000

# Modify nginx to listen on port 8000 instead of default 80
RUN sed -i 's/listen\s*80;/listen 8000;/g' /etc/nginx/conf.d/default.conf

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
