import numpy as np


def mae(actual, pred):
    return float(np.mean(np.abs(np.asarray(actual) - np.asarray(pred))))


def rmse(actual, pred):
    return float(np.sqrt(np.mean((np.asarray(actual) - np.asarray(pred)) ** 2)))


def mape(actual, pred, eps: float = 1.0):
    actual = np.asarray(actual, dtype=float)
    pred = np.asarray(pred, dtype=float)
    denom = np.where(actual == 0, eps, actual)
    return float(np.mean(np.abs((actual - pred) / denom)) * 100)


def evaluate(actual, pred) -> dict:
    return {"MAE": round(mae(actual, pred), 3), "RMSE": round(rmse(actual, pred), 3), "MAPE_%": round(mape(actual, pred), 2)}
