#!/usr/bin/env python3
"""
Password Hash Generator for Portfolio Admin Panel

Run this script to generate a SHA-256 hash for your admin password.
Copy the generated hash to your data/config.json file.
"""

import hashlib
import getpass

def generate_hash(password):
    """Generate SHA-256 hash of the password."""
    return hashlib.sha256(password.encode()).hexdigest()

if __name__ == '__main__':
    print("=" * 50)
    print("Portfolio Admin Password Hash Generator")
    print("=" * 50)
    print()
    
    # Get password securely (hidden input)
    password = getpass.getpass("Enter your admin password: ")
    confirm = getpass.getpass("Confirm your password: ")
    
    if password != confirm:
        print("\n❌ Passwords do not match. Please try again.")
        exit(1)
    
    if len(password) < 4:
        print("\n⚠️  Warning: Password is very short. Consider using a stronger password.")
    
    password_hash = generate_hash(password)
    
    print()
    print("✅ Password hash generated successfully!")
    print()
    print("Your password hash:")
    print("-" * 64)
    print(password_hash)
    print("-" * 64)
    print()
    print("Add this to your data/config.json file as:")
    print(f'  "admin_password_hash": "{password_hash}"')
    print()
