import asyncio
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def test():
    client = AsyncOpenAI(
        base_url='https://integrate.api.nvidia.com/v1',
        api_key=os.getenv('NVIDIA_NEMOTRON_API_KEY')
    )
    try:
        res = await client.chat.completions.create(
            model='nvidia/nemotron-3-ultra-550b-a55b',
            messages=[{'role': 'user', 'content': 'hi'}]
        )
        print("Success:", res)
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
