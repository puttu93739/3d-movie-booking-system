from app.database import Base, engine
from app.models import User, RefreshSession

def main():
    Base.metadata.create_all(
        bind=engine,
        tables=[
            User.__table__,
            RefreshSession.__table__,
        ],
        checkfirst=True,
    )

    print("Authentication tables created successfully!")

if __name__ == "__main__":
    main()