export default function PromiseWaiter(time: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => resolve(), time);
  });
}
