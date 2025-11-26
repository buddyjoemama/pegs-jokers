#!/bin/bash

# Azure CLI deployment script for Pegs & Jokers
# Prerequisites: Azure CLI installed and logged in

# Variables
RESOURCE_GROUP="rg-pegs-jokers"
APP_NAME="pegs-jokers-app"
LOCATION="East US 2"
SKU="Free"

# Load environment variables from .env.local
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local..."
  export $(grep -v '^#' .env.local | xargs)
else
  echo "Warning: .env.local file not found!"
fi

echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location "$LOCATION"

echo "Creating Static Web App..."
az staticwebapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --source https://github.com/buddyjoemama/pegs-jokers \
  --location "$LOCATION" \
  --branch main \
  --app-location "/" \
  --output-location "out" \
  --sku $SKU

echo "Configuring environment variables..."
az staticwebapp appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --setting-names \
    NEXT_PUBLIC_FIREBASE_API_KEY="$NEXT_PUBLIC_FIREBASE_API_KEY" \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" \
    NEXT_PUBLIC_FIREBASE_DATABASE_URL="$NEXT_PUBLIC_FIREBASE_DATABASE_URL" \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="$NEXT_PUBLIC_FIREBASE_PROJECT_ID" \
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" \
    NEXT_PUBLIC_FIREBASE_APP_ID="$NEXT_PUBLIC_FIREBASE_APP_ID"

echo "Deployment initiated! Check Azure Portal for progress."
echo "Your app will be available at: https://$APP_NAME.azurestaticapps.net"
echo ""
echo "Environment variables have been configured in Azure Static Web Apps."