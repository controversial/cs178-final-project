declare module '*.module.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*?url' {
  const path: string;
  export default path;
}

interface ReadableStream<R = any> {
  [Symbol.asyncIterator](): AsyncIterator<R>;
}


/* Better string.toUpperCase() / string.toLowerCase() */
interface String {
  toUpperCase<T extends string>(this: T): Uppercase<T>;
  toLowerCase<T extends string>(this: T): Lowercase<T>;
}


/* Better object.fromEntries type (for readonly tuple inputs) */
/* eslint-disable max-len */

type IsUnion<T, U extends T = T> =
  T extends unknown ? [U] extends [T] ? false : true : false;
type IfUnion<T, Yes, No> = true extends IsUnion<T> ? Yes : No;
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
type InferKeyOptionalityFromTupleType<Tuple extends readonly [PropertyKey, any]> = UnionToIntersection<
  Tuple extends [any, any]
    ? {[K in Tuple[0]]?: any}
    : IfUnion<Tuple[0], {[K in Tuple[0]]?: any}, {[K in Tuple[0]]: any}>
  >

interface ObjectConstructor {
  fromEntries<Tuples extends readonly [...readonly (readonly [PropertyKey, any])[]]>(
    entries: Tuples,
  ): Tuples extends [...Tuples[number][]]
    ? { [K in Tuples[number][0]]?: (readonly [K, Tuples[number][1]] & Tuples[number])[1] }
    : { [K in keyof InferKeyOptionalityFromTupleType<Tuples[number]>]: (readonly [K, Tuples[number][1]] & Tuples[number])[1] }
}
