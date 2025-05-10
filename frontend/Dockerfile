# Step 1: Use an official Node.js image as the base image
FROM node:16 AS build

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json (or yarn.lock) into the container
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the entire project into the container
COPY . .

# Step 6: Build the React app for production
RUN npm run build

# Step 7: Use a lighter web server to serve the built files
FROM nginx:alpine

# Step 8: Copy the build output to the Nginx public folder
COPY --from=build /app/build /usr/share/nginx/html

# Step 9: Expose the port that the container will use
EXPOSE 80

# Step 10: Start Nginx to serve the frontend app
CMD ["nginx", "-g", "daemon off;"]
