# --- Build Stage ---
    FROM node:18-alpine AS build-stage

    WORKDIR /app
    
    COPY package*.json ./
    RUN npm install
    
    COPY . .
    RUN npm run build # This creates the 'dist' folder with your built React app
    
    # --- Production Stage ---
    FROM nginx:alpine AS production-stage
    
    # Copy the custom Nginx configuration file
    COPY ./nginx.conf /etc/nginx/nginx.conf 
    
    # Copy the built React app from the build stage to Nginx's html directory
    COPY --from=build-stage /app/dist /usr/share/nginx/html
    
    # Expose port 80
    EXPOSE 80
    
    # Command to start Nginx
    CMD ["nginx", "-g", "daemon off;"]