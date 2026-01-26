import { initializePaddle, Paddle } from '@paddle/paddle-js';

let paddleInstance: Paddle | undefined;

export const getPaddleInstance = async () => {
  if (paddleInstance) return paddleInstance;

  try {
    paddleInstance = await initializePaddle({
      environment: 'sandbox',
      token: 'test_12345', // Replace with your actual Client-side token
      eventCallback: (data) => {
        console.log('Paddle Event:', data);
      }
    });

    return paddleInstance;
  } catch (error) {
    console.error('Failed to initialize Paddle:', error);
    return undefined;
  }
};
