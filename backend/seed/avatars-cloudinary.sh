#!/usr/bin/env bash
# Envoie les avatars de démo (seed/avatars/*.webp) chez Cloudinary, pour que les profils de démo gardent leur photo
# quand le disque du serveur est effacé (redéploiement). À lancer une fois par compte Cloudinary, avant
# seed/photos-cloudinary.sql. Rejouable : chaque image garde le même identifiant et est simplement écrasée.
#
# Variables (les mêmes que le back-end, par exemple : set -a; . ./.env; set +a) :
#   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_FOLDER (zetsu par défaut)
# Le secret ne sert qu'à signer localement : il n'est jamais envoyé ni affiché.

set -euo pipefail

: "${CLOUDINARY_CLOUD_NAME:?CLOUDINARY_CLOUD_NAME manquant}"
: "${CLOUDINARY_API_KEY:?CLOUDINARY_API_KEY manquant}"
: "${CLOUDINARY_API_SECRET:?CLOUDINARY_API_SECRET manquant}"
folder="${CLOUDINARY_FOLDER:-zetsu}"
api_base="${CLOUDINARY_API_BASE:-https://api.cloudinary.com}"
dir="$(cd "$(dirname "$0")" && pwd)/avatars"

count=0
for file in "$dir"/*.webp; do
  name="$(basename "$file" .webp)"
  public_id="$folder/avatars/$name"
  timestamp="$(date +%s)"
  # Signature Cloudinary : paramètres triés par nom, joints par &, suivis du secret, en SHA-1.
  signature="$(printf '%s' "overwrite=true&public_id=$public_id&timestamp=$timestamp$CLOUDINARY_API_SECRET" \
    | sha1sum | cut -d' ' -f1)"

  response="$(curl -sS -X POST "$api_base/v1_1/$CLOUDINARY_CLOUD_NAME/image/upload" \
    -F "file=@$file" \
    -F "public_id=$public_id" \
    -F "overwrite=true" \
    -F "timestamp=$timestamp" \
    -F "api_key=$CLOUDINARY_API_KEY" \
    -F "signature=$signature")"

  if [[ "$response" != *'"secure_url"'* ]]; then
    echo "Échec pour $name : $response" >&2
    exit 1
  fi
  echo "Envoyé : $public_id"
  count=$((count + 1))
done

echo "$count avatars envoyés. Lancer ensuite seed/photos-cloudinary.sql avec -v cloud_name=$CLOUDINARY_CLOUD_NAME -v folder=$folder"
