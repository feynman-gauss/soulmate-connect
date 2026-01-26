#!/bin/bash
# SSL Setup Script for Soulmate Connect
# This script helps set up Let's Encrypt SSL certificates

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN} Soulmate Connect SSL Setup ${NC}"
echo -e "${GREEN}==================================${NC}"

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${RED}Usage: ./setup-ssl.sh your-domain.com${NC}"
    echo "Example: ./setup-ssl.sh matrimonial.example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@$DOMAIN"}

echo -e "${YELLOW}Setting up SSL for: $DOMAIN${NC}"
echo -e "${YELLOW}Using email: $EMAIL${NC}"

# Create necessary directories
mkdir -p ./nginx/ssl
mkdir -p ./certbot/www

# Step 1: Update nginx.conf with your domain
echo -e "${YELLOW}Updating nginx configuration...${NC}"
sed -i "s/your-domain.com/$DOMAIN/g" ./nginx/nginx.conf

# Step 2: Update docker-compose.prod.yml with your domain
echo -e "${YELLOW}Updating docker-compose configuration...${NC}"
sed -i "s/your-domain.com/$DOMAIN/g" ./docker-compose.prod.yml

# Step 3: Generate self-signed certificate for initial setup
echo -e "${YELLOW}Generating temporary self-signed certificate...${NC}"
openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
    -keyout ./nginx/ssl/privkey.pem \
    -out ./nginx/ssl/fullchain.pem \
    -subj "/CN=$DOMAIN"

echo -e "${GREEN}Temporary certificate created.${NC}"

# Step 4: Start nginx to validate domain
echo -e "${YELLOW}Starting nginx for domain validation...${NC}"
docker-compose -f docker-compose.prod.yml up -d nginx

echo -e "${YELLOW}Waiting for nginx to start...${NC}"
sleep 5

# Step 5: Get real certificate from Let's Encrypt
echo -e "${YELLOW}Requesting Let's Encrypt certificate...${NC}"
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Step 6: Copy certificates
echo -e "${YELLOW}Copying certificates...${NC}"
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./nginx/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./nginx/ssl/

# Step 7: Restart nginx
echo -e "${YELLOW}Restarting nginx with real certificates...${NC}"
docker-compose -f docker-compose.prod.yml restart nginx

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN} SSL Setup Complete! ${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "Your site is now available at:"
echo -e "  ${GREEN}https://$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}Note: Certificate will auto-renew via certbot container.${NC}"
