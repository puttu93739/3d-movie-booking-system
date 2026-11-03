
from sqlalchemy import text
from app.database import engine


def test_connection():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT current_database()")
        )
        database_name = result.scalar_one()

        print("Database connected successfully!")
        print("Database:", database_name)


if __name__ == "__main__":
    test_connection()
