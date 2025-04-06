#!/bin/bash
# scripts/test-cardrush.sh

# サーバーが起動していることを確認
echo "Testing cardrush-pokemon workflow..."

# APIを呼び出し
curl -X POST "http://localhost:3000/api/workflows/cardrush-pokemon" \
  -H "Content-Type: application/json" \
  -d '{
    "promptUniqueKey": "dec25340-f547-4148-99e3-df9fce4e0e1d",
    "keyword": "マリィ",
    "options": {
      "stock": "in-stock",
      "sort": "price-asc",
      "display": "100"
    }
  }'

echo -e "\n\nAPI request sent. Check server logs for results." 