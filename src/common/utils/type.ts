// 해당 키(K)만 optional, 나머지는 required
export type WithOptional<T, K extends keyof T> = Required<Omit<T, K>> & Partial<Pick<T, K>>;
