FROM php:8.4-cli

# System libraries and the PHP extensions Laravel needs for PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev git unzip \
    && docker-php-ext-install pdo pdo_pgsql pgsql

# Copy the Composer binary from the official Composer image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app