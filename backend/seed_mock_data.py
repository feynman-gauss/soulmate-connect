"""
Script to seed MongoDB with mock user data for testing
Run from backend directory: python seed_mock_data.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import random
import bcrypt

# MongoDB connection
MONGODB_URL = "mongodb://admin:admin123@localhost:27017"
DATABASE_NAME = "soulmate_connect"

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Mock data options
MALE_NAMES = [
    "Aarav Sharma", "Vihaan Gupta", "Aditya Singh", "Arjun Verma", "Reyansh Patel",
    "Ayaan Kumar", "Krishna Reddy", "Ishaan Joshi", "Sai Rao", "Arnav Kapoor",
    "Dhruv Malhotra", "Kabir Mehta", "Ansh Agarwal", "Vivaan Choudhary", "Rohan Tiwari"
]

FEMALE_NAMES = [
    "Aadhya Sharma", "Ananya Gupta", "Diya Singh", "Saanvi Verma", "Ishita Patel",
    "Anika Kumar", "Priya Reddy", "Kavya Joshi", "Riya Rao", "Myra Kapoor",
    "Aanya Malhotra", "Kiara Mehta", "Isha Agarwal", "Neha Choudhary", "Pooja Tiwari"
]

CITIES = [
    {"city": "Mumbai", "state": "Maharashtra"},
    {"city": "Delhi", "state": "Delhi"},
    {"city": "Bangalore", "state": "Karnataka"},
    {"city": "Hyderabad", "state": "Telangana"},
    {"city": "Chennai", "state": "Tamil Nadu"},
    {"city": "Pune", "state": "Maharashtra"},
    {"city": "Kolkata", "state": "West Bengal"},
    {"city": "Jaipur", "state": "Rajasthan"},
    {"city": "Lucknow", "state": "Uttar Pradesh"},
    {"city": "Ahmedabad", "state": "Gujarat"},
]

RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Jain"]
EDUCATION_LEVELS = ["B.Tech", "MBA", "M.Tech", "MBBS", "CA", "B.Com", "M.Sc", "PhD", "BBA", "LLB"]
OCCUPATIONS = [
    "Software Engineer", "Doctor", "Teacher", "Business Owner", "Government Officer",
    "Lawyer", "Chartered Accountant", "Data Scientist", "Product Manager", "Consultant",
    "Architect", "Civil Engineer", "Banker", "Marketing Manager", "HR Manager"
]

INTERESTS = [
    "Reading", "Traveling", "Music", "Cooking", "Photography", "Yoga", "Fitness",
    "Movies", "Dancing", "Art", "Gaming", "Sports", "Hiking", "Swimming", "Meditation"
]

ABOUT_TEMPLATES_MALE = [
    "I'm a {occupation} based in {city}. Love spending weekends exploring new places and trying different cuisines. Looking for someone who shares my enthusiasm for life.",
    "Passionate about my work as a {occupation}. When not working, you'll find me {interest1} or {interest2}. Believe in living life to the fullest.",
    "Simple guy with big dreams. Work as a {occupation} and enjoy a balanced life. Looking for a life partner who values family and career equally.",
    "Tech enthusiast and {occupation} by profession. Love good conversations, {interest1}, and {interest2}. Seeking a meaningful connection.",
    "A {occupation} who believes in hard work and having fun. Passionate about {interest1} and {interest2}. Looking for someone genuine and caring."
]

ABOUT_TEMPLATES_FEMALE = [
    "I'm a {occupation} who loves {interest1} and {interest2}. Looking for someone who can match my energy and share life's adventures with me.",
    "Creative soul working as a {occupation}. Passionate about {interest1} and enjoy peaceful evenings with good music. Seeking a genuine connection.",
    "Independent and ambitious {occupation}. Love exploring new places and trying new things. Looking for someone who respects individuality and togetherness.",
    "A {occupation} with a love for {interest1} and {interest2}. Believe in growing together and supporting each other's dreams.",
    "Cheerful and optimistic {occupation}. Enjoy {interest1}, {interest2}, and meaningful conversations. Looking for my forever person."
]

HEIGHTS_MALE = ["5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"", "6'2\""]
HEIGHTS_FEMALE = ["5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"", "5'7\"", "5'8\""]

SALARIES = ["5-10 LPA", "10-15 LPA", "15-20 LPA", "20-30 LPA", "30-50 LPA", "50+ LPA"]

async def create_mock_users():
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    # Clear existing mock users (optional - keeping real users)
    # await db.users.delete_many({"is_mock": True})
    
    users_to_insert = []
    base_password = hash_password("Test@1234")  # All mock users have same password
    
    # Create male profiles
    for i, name in enumerate(MALE_NAMES):
        city_data = random.choice(CITIES)
        interests = random.sample(INTERESTS, k=random.randint(3, 6))
        occupation = random.choice(OCCUPATIONS)
        about_template = random.choice(ABOUT_TEMPLATES_MALE)
        
        user = {
            "email": f"male{i+1}@test.com",
            "name": name,
            "phone": f"98765{str(i).zfill(5)}",
            "age": random.randint(24, 35),
            "gender": "male",
            "password_hash": base_password,
            "location": {
                "city": city_data["city"],
                "state": city_data["state"],
                "country": "India"
            },
            "religion": random.choice(RELIGIONS),
            "education": random.choice(EDUCATION_LEVELS),
            "occupation": occupation,
            "height": random.choice(HEIGHTS_MALE),
            "salary": random.choice(SALARIES),
            "about": about_template.format(
                occupation=occupation,
                city=city_data["city"],
                interest1=interests[0],
                interest2=interests[1] if len(interests) > 1 else interests[0]
            ),
            "interests": interests,
            "looking_for": ["female"],
            "marital_status": random.choice(["Never Married", "Never Married", "Never Married", "Divorced"]),
            "photos": [],
            "verified": random.choice([True, True, False]),
            "premium": random.choice([True, False, False, False]),
            "is_active": True,
            "profile_completion": random.randint(60, 100),
            "preferences": {
                "age_range": {"min": 21, "max": 32},
                "religion": [],
                "education": [],
                "location": [],
                "height_range": {"min": 150, "max": 175},
                "max_distance": 50
            },
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 90)),
            "updated_at": datetime.utcnow(),
            "last_active": datetime.utcnow() - timedelta(hours=random.randint(0, 48)),
            "is_mock": True  # Tag to identify mock data
        }
        users_to_insert.append(user)
    
    # Create female profiles
    for i, name in enumerate(FEMALE_NAMES):
        city_data = random.choice(CITIES)
        interests = random.sample(INTERESTS, k=random.randint(3, 6))
        occupation = random.choice(OCCUPATIONS)
        about_template = random.choice(ABOUT_TEMPLATES_FEMALE)
        
        user = {
            "email": f"female{i+1}@test.com",
            "name": name,
            "phone": f"91234{str(i).zfill(5)}",
            "age": random.randint(22, 32),
            "gender": "female",
            "password_hash": base_password,
            "location": {
                "city": city_data["city"],
                "state": city_data["state"],
                "country": "India"
            },
            "religion": random.choice(RELIGIONS),
            "education": random.choice(EDUCATION_LEVELS),
            "occupation": occupation,
            "height": random.choice(HEIGHTS_FEMALE),
            "salary": random.choice(SALARIES),
            "about": about_template.format(
                occupation=occupation,
                city=city_data["city"],
                interest1=interests[0],
                interest2=interests[1] if len(interests) > 1 else interests[0]
            ),
            "interests": interests,
            "looking_for": ["male"],
            "marital_status": random.choice(["Never Married", "Never Married", "Never Married", "Divorced"]),
            "photos": [],
            "verified": random.choice([True, True, False]),
            "premium": random.choice([True, False, False, False]),
            "is_active": True,
            "profile_completion": random.randint(60, 100),
            "preferences": {
                "age_range": {"min": 24, "max": 38},
                "religion": [],
                "education": [],
                "location": [],
                "height_range": {"min": 165, "max": 190},
                "max_distance": 50
            },
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 90)),
            "updated_at": datetime.utcnow(),
            "last_active": datetime.utcnow() - timedelta(hours=random.randint(0, 48)),
            "is_mock": True
        }
        users_to_insert.append(user)
    
    # Insert all users
    result = await db.users.insert_many(users_to_insert)
    print(f"✅ Successfully inserted {len(result.inserted_ids)} mock users!")
    print(f"   - {len(MALE_NAMES)} male profiles")
    print(f"   - {len(FEMALE_NAMES)} female profiles")
    print("\n📧 Test credentials:")
    print("   Email: male1@test.com to male15@test.com")
    print("   Email: female1@test.com to female15@test.com")
    print("   Password: Test@1234")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(create_mock_users())
