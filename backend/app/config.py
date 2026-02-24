from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Soulmate Connect API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Database
    MONGODB_URL: str
    MONGODB_DB_NAME: str = "soulmate_connect"
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 5242880  # 5MB
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,webp"
    MAX_PHOTOS_PER_PROFILE: int = 6
    
    # AWS S3 (Optional)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""
    AWS_REGION: str = "us-east-1"
    
    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@soulmateconnect.com"
    
    # Payment
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    
    # Matching Algorithm
    MAX_DISCOVERY_PROFILES: int = 20
    COMPATIBILITY_WEIGHTS_LOCATION: float = 0.30
    COMPATIBILITY_WEIGHTS_INTERESTS: float = 0.25
    COMPATIBILITY_WEIGHTS_EDUCATION: float = 0.15
    COMPATIBILITY_WEIGHTS_AGE: float = 0.15
    COMPATIBILITY_WEIGHTS_RELIGION: float = 0.10
    COMPATIBILITY_WEIGHTS_PROFILE_COMPLETION: float = 0.05
    
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
