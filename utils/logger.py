import logging
from datetime import datetime
from functools import wraps

def setup_logger():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('ai_hustle.log'),
            logging.StreamHandler()
        ]
    )

def log_operation(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = datetime.now()
        result = func(*args, **kwargs)
        duration = (datetime.now() - start_time).total_seconds()
        
        logging.info(
            f"Operation {func.__name__} completed in {duration:.2f}s | "
            f"Args: {args} | Kwargs: {kwargs}"
        )
        return result
    return wrapper