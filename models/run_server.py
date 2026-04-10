#!/usr/bin/env python
"""
Entry point for Critical Care AI Safety Monitor
Run from the models/ directory: python run_server.py
"""
import os
import sys

# Ensure we're running from models/ directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, print_routes

if __name__ == "__main__":
    print("\n" + "="*55)
    print("  Critical Care AI Safety Monitor — v2.0")
    print("="*55)
    print_routes()
    print(f"  Server: http://0.0.0.0:5003")
    print(f"  Ollama: http://localhost:11434 (llava:7b)")
    print("="*55 + "\n")
    app.run(host="0.0.0.0", port=5003, debug=False)
