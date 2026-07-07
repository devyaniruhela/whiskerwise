"""Runtime config — loads app/config.yaml once; paths resolve relative to the yaml file."""

import os
from functools import lru_cache
from pathlib import Path

import yaml

DEFAULT_CONFIG = Path(__file__).resolve().parents[2] / "config.yaml"  # 01-wiser/app/config.yaml


@lru_cache
def get_config() -> dict:
    path = Path(os.environ.get("WISER_CONFIG", DEFAULT_CONFIG)).resolve()
    with open(path, encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    cfg["_paths"] = {k: (path.parent / v).resolve() for k, v in cfg.get("paths", {}).items()}
    return cfg
