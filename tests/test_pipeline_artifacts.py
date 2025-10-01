from __future__ import annotations

from pathlib import Path

import pytest


@pytest.mark.usefixtures("trained_service")
def test_training_artifacts_exist(temp_config):
    assert Path(temp_config.artifacts.model_path).exists()
    assert Path(temp_config.artifacts.metrics_report).exists()
    assert Path(temp_config.artifacts.feature_importances).exists()
    assert Path(temp_config.data.processed_path).exists()
