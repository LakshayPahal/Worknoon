import asyncio
from typing import Dict, Any, AsyncGenerator

class LogObserver:
    def __init__(self):
        # A dictionary to hold log queues for different session IDs
        self.queues: Dict[str, asyncio.Queue] = {}

    def get_queue(self, session_id: str) -> asyncio.Queue:
        if session_id not in self.queues:
            self.queues[session_id] = asyncio.Queue()
        return self.queues[session_id]

    async def emit(self, session_id: str, message: str):
        """Emit a log message to a specific session's queue."""
        queue = self.get_queue(session_id)
        await queue.put(message)

    async def stream_logs(self, session_id: str) -> AsyncGenerator[str, None]:
        """Generator that yields logs as they are pushed to the queue."""
        queue = self.get_queue(session_id)
        try:
            while True:
                # Wait for the next log message
                log = await queue.get()
                yield f"data: {log}\n\n"
        except asyncio.CancelledError:
            # Handle client disconnect
            pass

# Global observer instance
observer = LogObserver()
