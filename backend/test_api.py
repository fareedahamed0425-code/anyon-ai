import asyncio
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def test():
    key = (
        os.getenv('NVIDIA_LLAMA_API_KEY') or 
        os.getenv('NVIDIA_DEEPSEEK_API_KEY') or 
        os.getenv('NVIDIA_NEMOTRON_API_KEY') or
        os.getenv('NVIDIA_KIMI_API_KEY')
    )
    client = AsyncOpenAI(
        base_url='https://integrate.api.nvidia.com/v1',
        api_key=key
    )
    
    # Let's list models
    try:
        models = await client.models.list()
        print("Available models:")
        for m in models.data:
            print(" -", m.id)
    except Exception as e:
        print("List models error:", e)

    test_models = [
        "meta/llama-3.3-70b-instruct",
        "meta/llama-3.1-70b-instruct",
        "meta/llama-3.1-8b-instruct",
        "nvidia/llama-3.1-nemotron-70b-instruct",
        "nvidia/nemotron-4-340b-instruct",
        "deepseek-ai/deepseek-r1",
        "deepseek-ai/deepseek-v3",
        "moonshotai/kimi-k3"
    ]
    
    for tm in test_models:
        try:
            res = await client.chat.completions.create(
                model=tm,
                messages=[{'role': 'user', 'content': 'hi'}],
                max_tokens=10
            )
            print(f"[SUCCESS] {tm}: {res.choices[0].message.content}")
        except Exception as e:
            print(f"[FAILED] {tm}: {e}")

asyncio.run(test())
