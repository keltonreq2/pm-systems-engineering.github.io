#!/usr/bin/env python3
"""Create the PBKDF2 hash for Cloudflare's ADMIN_PASSWORD_HASH secret."""

import base64
import getpass
import hashlib
import secrets

ITERATIONS = 600_000


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


password = getpass.getpass("Nouveau mot de passe administrateur (non affiché) : ")
confirmation = getpass.getpass("Confirme le mot de passe : ")
if len(password) < 14:
    raise SystemExit("Choisis une phrase de passe d’au moins 14 caractères.")
if len(password) > 1024:
    raise SystemExit("La phrase de passe ne peut pas dépasser 1 024 caractères.")
if password != confirmation:
    raise SystemExit("Les deux saisies doivent être identiques et non vides.")

salt = secrets.token_bytes(16)
digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, ITERATIONS, dklen=32)
print(f"pbkdf2_sha256${ITERATIONS}${b64url(salt)}${b64url(digest)}")
