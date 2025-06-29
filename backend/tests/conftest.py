from unittest import mock
import pytest
import mongomock

with mock.patch("pymongo.MongoClient", new=lambda *a, **k: mongomock.MongoClient()):
    from server import collection as jobs_collection

@pytest.fixture()
def client():
    from server import app
    app.config.update(TESTING=True)
    with app.test_client() as client:
        yield client

@pytest.fixture(autouse=True)
def clear_db():
    jobs_collection.delete_many({})
    yield

@pytest.fixture()
def collection():
    """Alias für die Mongo-Collection, damit bestehende Tests funktionieren."""
    from server import collection as jobs_collection
    return jobs_collection
