#!/bin/bash

# Azure CLI deployment script for Pegs & Jokers
# Prerequisites: Azure CLI installed and logged in

# Variables
RESOURCE_GROUP="rg-pegs-jokers"
APP_NAME="pegs-jokers-app"
LOCATION="East US 2"
SKU="Free"

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

echo "Deployment initiated! Check Azure Portal for progress."
echo "Your app will be available at: https://$APP_NAME.azurestaticapps.net"