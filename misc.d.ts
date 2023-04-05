declare module '*.module.scss' {
  const content: Record<string, string>;
  export default content;
}

interface ReadableStream<R = any> {
  [Symbol.asyncIterator](): AsyncIterator<R>;
}
