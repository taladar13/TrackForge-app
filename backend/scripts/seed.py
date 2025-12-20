"""Seed script to populate database with demo data."""

import asyncio
from datetime import date, datetime, timedelta, UTC
from uuid import uuid4

from app.core.database import async_session_maker, engine, Base
from app.core.security import hash_password
from app.domains.auth.models import User
from app.domains.users.models import Profile
from app.domains.nutrition.models import FoodItem, DietPlan, DietMeal, DietMealItem, FoodLog
from app.domains.workouts.models import Exercise, WorkoutProgram, WorkoutProgramDay, WorkoutSession, WorkoutSet
from app.domains.progress.models import BodyMetric


async def seed_database():
    """Seed the database with demo data."""
    print("🌱 Starting database seed...")

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as db:
        # Check if already seeded
        existing = await db.execute(
            "SELECT id FROM users WHERE email = 'demo@trackforge.com'"
        )
        if existing.scalar_one_or_none():
            print("⚠️  Database already seeded. Skipping.")
            return

        # =====================
        # Create Demo User
        # =====================
        print("👤 Creating demo user...")
        user_id = str(uuid4())
        user = User(
            id=user_id,
            email="demo@trackforge.com",
            password_hash=hash_password("demo1234"),
        )
        db.add(user)

        profile = Profile(
            user_id=user_id,
            age=28,
            sex="male",
            height_cm=178,
            weight_kg=82,
            activity_level="active",
            goal="maintain",
            units={"weight": "kg", "height": "cm", "energy": "kcal"},
        )
        db.add(profile)

        # =====================
        # Create Food Items
        # =====================
        print("🍎 Creating food items...")
        foods = [
            FoodItem(id=str(uuid4()), name="Chicken Breast", calories=165, protein=31, carbs=0, fat=3.6, unit="g"),
            FoodItem(id=str(uuid4()), name="Brown Rice", calories=112, protein=2.6, carbs=24, fat=0.9, unit="g"),
            FoodItem(id=str(uuid4()), name="Broccoli", calories=34, protein=2.8, carbs=7, fat=0.4, fiber=2.6, unit="g"),
            FoodItem(id=str(uuid4()), name="Salmon", calories=208, protein=20, carbs=0, fat=13, unit="g"),
            FoodItem(id=str(uuid4()), name="Sweet Potato", calories=86, protein=1.6, carbs=20, fat=0.1, fiber=3, unit="g"),
            FoodItem(id=str(uuid4()), name="Greek Yogurt", calories=59, protein=10, carbs=3.6, fat=0.7, unit="g"),
            FoodItem(id=str(uuid4()), name="Oatmeal", calories=389, protein=17, carbs=66, fat=7, fiber=11, unit="g"),
            FoodItem(id=str(uuid4()), name="Eggs", calories=155, protein=13, carbs=1.1, fat=11, unit="g"),
            FoodItem(id=str(uuid4()), name="Banana", calories=89, protein=1.1, carbs=23, fat=0.3, fiber=2.6, unit="g"),
            FoodItem(id=str(uuid4()), name="Almonds", calories=579, protein=21, carbs=22, fat=50, fiber=12, unit="g"),
            FoodItem(id=str(uuid4()), name="Olive Oil", calories=884, protein=0, carbs=0, fat=100, unit="ml"),
            FoodItem(id=str(uuid4()), name="Whey Protein", calories=120, protein=24, carbs=3, fat=1, unit="g"),
        ]
        for food in foods:
            db.add(food)
        await db.flush()

        # =====================
        # Create Diet Plan
        # =====================
        print("🥗 Creating diet plan...")
        diet_plan = DietPlan(
            id=str(uuid4()),
            user_id=user_id,
            name="High Protein Maintenance",
            days_of_week=[1, 2, 3, 4, 5],  # Mon-Fri
            is_current=True,
        )
        db.add(diet_plan)
        await db.flush()

        # Breakfast
        breakfast = DietMeal(
            id=str(uuid4()),
            plan_id=diet_plan.id,
            name="Breakfast",
            time="07:30",
            sort_order=0,
        )
        db.add(breakfast)
        await db.flush()

        # Find food IDs
        oatmeal = next(f for f in foods if f.name == "Oatmeal")
        banana = next(f for f in foods if f.name == "Banana")
        greek_yogurt = next(f for f in foods if f.name == "Greek Yogurt")
        
        db.add(DietMealItem(meal_id=breakfast.id, food_id=oatmeal.id, planned_quantity=80))
        db.add(DietMealItem(meal_id=breakfast.id, food_id=banana.id, planned_quantity=120))
        db.add(DietMealItem(meal_id=breakfast.id, food_id=greek_yogurt.id, planned_quantity=150))

        # Lunch
        lunch = DietMeal(
            id=str(uuid4()),
            plan_id=diet_plan.id,
            name="Lunch",
            time="12:30",
            sort_order=1,
        )
        db.add(lunch)
        await db.flush()

        chicken = next(f for f in foods if f.name == "Chicken Breast")
        rice = next(f for f in foods if f.name == "Brown Rice")
        broccoli = next(f for f in foods if f.name == "Broccoli")

        db.add(DietMealItem(meal_id=lunch.id, food_id=chicken.id, planned_quantity=200))
        db.add(DietMealItem(meal_id=lunch.id, food_id=rice.id, planned_quantity=150))
        db.add(DietMealItem(meal_id=lunch.id, food_id=broccoli.id, planned_quantity=150))

        # Dinner
        dinner = DietMeal(
            id=str(uuid4()),
            plan_id=diet_plan.id,
            name="Dinner",
            time="19:00",
            sort_order=2,
        )
        db.add(dinner)
        await db.flush()

        salmon = next(f for f in foods if f.name == "Salmon")
        sweet_potato = next(f for f in foods if f.name == "Sweet Potato")

        db.add(DietMealItem(meal_id=dinner.id, food_id=salmon.id, planned_quantity=180))
        db.add(DietMealItem(meal_id=dinner.id, food_id=sweet_potato.id, planned_quantity=200))
        db.add(DietMealItem(meal_id=dinner.id, food_id=broccoli.id, planned_quantity=100))

        # =====================
        # Create Exercises
        # =====================
        print("💪 Creating exercises...")
        exercises = [
            Exercise(id=str(uuid4()), name="Bench Press", equipment_type="Barbell", muscle_groups=["chest", "triceps", "shoulders"], category="strength"),
            Exercise(id=str(uuid4()), name="Squat", equipment_type="Barbell", muscle_groups=["quadriceps", "glutes", "hamstrings"], category="strength"),
            Exercise(id=str(uuid4()), name="Deadlift", equipment_type="Barbell", muscle_groups=["back", "hamstrings", "glutes"], category="strength"),
            Exercise(id=str(uuid4()), name="Overhead Press", equipment_type="Barbell", muscle_groups=["shoulders", "triceps"], category="strength"),
            Exercise(id=str(uuid4()), name="Barbell Row", equipment_type="Barbell", muscle_groups=["back", "biceps"], category="strength"),
            Exercise(id=str(uuid4()), name="Pull-ups", equipment_type="Bodyweight", muscle_groups=["back", "biceps"], category="strength"),
            Exercise(id=str(uuid4()), name="Dumbbell Curl", equipment_type="Dumbbell", muscle_groups=["biceps"], category="strength"),
            Exercise(id=str(uuid4()), name="Tricep Pushdown", equipment_type="Cable", muscle_groups=["triceps"], category="strength"),
            Exercise(id=str(uuid4()), name="Leg Press", equipment_type="Machine", muscle_groups=["quadriceps", "glutes"], category="strength"),
            Exercise(id=str(uuid4()), name="Romanian Deadlift", equipment_type="Barbell", muscle_groups=["hamstrings", "glutes", "back"], category="strength"),
            Exercise(id=str(uuid4()), name="Lateral Raise", equipment_type="Dumbbell", muscle_groups=["shoulders"], category="strength"),
            Exercise(id=str(uuid4()), name="Face Pull", equipment_type="Cable", muscle_groups=["shoulders", "back"], category="strength"),
        ]
        for ex in exercises:
            db.add(ex)
        await db.flush()

        # =====================
        # Create Workout Program
        # =====================
        print("🏋️ Creating workout program...")
        program = WorkoutProgram(
            id=str(uuid4()),
            user_id=user_id,
            name="Push Pull Legs",
            frequency=6,
            split={
                "1": "Push",  # Monday
                "2": "Pull",  # Tuesday
                "3": "Legs",  # Wednesday
                "4": "Push",  # Thursday
                "5": "Pull",  # Friday
                "6": "Legs",  # Saturday
            },
            is_current=True,
        )
        db.add(program)
        await db.flush()

        # Push day
        bench = next(e for e in exercises if e.name == "Bench Press")
        ohp = next(e for e in exercises if e.name == "Overhead Press")
        lateral = next(e for e in exercises if e.name == "Lateral Raise")
        tricep = next(e for e in exercises if e.name == "Tricep Pushdown")

        push_day = WorkoutProgramDay(
            id=str(uuid4()),
            program_id=program.id,
            workout_name="Push",
            exercises=[
                {"exercise_id": bench.id, "target_sets": 4, "target_reps_min": 6, "target_reps_max": 8, "order": 0},
                {"exercise_id": ohp.id, "target_sets": 3, "target_reps_min": 8, "target_reps_max": 10, "order": 1},
                {"exercise_id": lateral.id, "target_sets": 3, "target_reps_min": 12, "target_reps_max": 15, "order": 2},
                {"exercise_id": tricep.id, "target_sets": 3, "target_reps_min": 10, "target_reps_max": 12, "order": 3},
            ],
        )
        db.add(push_day)

        # Pull day
        row = next(e for e in exercises if e.name == "Barbell Row")
        pullup = next(e for e in exercises if e.name == "Pull-ups")
        face_pull = next(e for e in exercises if e.name == "Face Pull")
        curl = next(e for e in exercises if e.name == "Dumbbell Curl")

        pull_day = WorkoutProgramDay(
            id=str(uuid4()),
            program_id=program.id,
            workout_name="Pull",
            exercises=[
                {"exercise_id": row.id, "target_sets": 4, "target_reps_min": 6, "target_reps_max": 8, "order": 0},
                {"exercise_id": pullup.id, "target_sets": 3, "target_reps_min": 6, "target_reps_max": 10, "order": 1},
                {"exercise_id": face_pull.id, "target_sets": 3, "target_reps_min": 15, "target_reps_max": 20, "order": 2},
                {"exercise_id": curl.id, "target_sets": 3, "target_reps_min": 10, "target_reps_max": 12, "order": 3},
            ],
        )
        db.add(pull_day)

        # Legs day
        squat = next(e for e in exercises if e.name == "Squat")
        rdl = next(e for e in exercises if e.name == "Romanian Deadlift")
        leg_press = next(e for e in exercises if e.name == "Leg Press")

        legs_day = WorkoutProgramDay(
            id=str(uuid4()),
            program_id=program.id,
            workout_name="Legs",
            exercises=[
                {"exercise_id": squat.id, "target_sets": 4, "target_reps_min": 6, "target_reps_max": 8, "order": 0},
                {"exercise_id": rdl.id, "target_sets": 3, "target_reps_min": 8, "target_reps_max": 10, "order": 1},
                {"exercise_id": leg_press.id, "target_sets": 3, "target_reps_min": 10, "target_reps_max": 12, "order": 2},
            ],
        )
        db.add(legs_day)

        # =====================
        # Create Sample Data (last 7 days)
        # =====================
        print("📊 Creating sample historical data...")
        today = date.today()

        for days_ago in range(7):
            current_date = today - timedelta(days=days_ago)

            # Body metric
            metric = BodyMetric(
                id=str(uuid4()),
                user_id=user_id,
                date=current_date,
                weight=82 - (days_ago * 0.1),  # Slight downward trend
            )
            db.add(metric)

            # Food logs (simplified - just log breakfast items)
            if current_date.weekday() < 5:  # Weekdays
                db.add(FoodLog(
                    id=str(uuid4()),
                    user_id=user_id,
                    food_id=oatmeal.id,
                    date=current_date,
                    meal_id=breakfast.id,
                    quantity=80,
                ))
                db.add(FoodLog(
                    id=str(uuid4()),
                    user_id=user_id,
                    food_id=banana.id,
                    date=current_date,
                    meal_id=breakfast.id,
                    quantity=120,
                ))

            # Workout session (alternate days)
            if days_ago % 2 == 0:
                session_id = str(uuid4())
                session = WorkoutSession(
                    id=session_id,
                    user_id=user_id,
                    program_id=program.id,
                    workout_name="Push" if days_ago % 6 < 2 else ("Pull" if days_ago % 6 < 4 else "Legs"),
                    date=current_date,
                    start_time=datetime.combine(current_date, datetime.min.time()).replace(hour=18, tzinfo=UTC),
                    end_time=datetime.combine(current_date, datetime.min.time()).replace(hour=19, minute=15, tzinfo=UTC),
                )
                db.add(session)
                await db.flush()

                # Add some sets
                for set_num in range(1, 4):
                    workout_set = WorkoutSet(
                        id=str(uuid4()),
                        session_id=session_id,
                        exercise_id=bench.id,
                        set_number=set_num,
                        weight=80,
                        reps=8,
                        completed=True,
                    )
                    db.add(workout_set)

        await db.commit()
        print("✅ Database seeded successfully!")
        print("\n📝 Demo credentials:")
        print("   Email: demo@trackforge.com")
        print("   Password: demo1234")


if __name__ == "__main__":
    asyncio.run(seed_database())


