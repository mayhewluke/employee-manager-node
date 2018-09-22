type MessageCreator<T extends string> = (...args: any[]) => Message<T>;
interface MessageCreatorsMapObject<T extends string> {
  [messageCreator: string]: MessageCreator<T>;
}

export type MessagesUnion<A extends MessageCreatorsMapObject<any>> = ReturnType<
  A[keyof A]
>;

export interface Message<T extends string> {
  type: T;
}

export interface MessageWithPayload<T extends string, P> extends Message<T> {
  payload: P;
}

/* eslint-disable import/export */
export function createMessage<T extends string>(type: T): Message<T>;
export function createMessage<T extends string, P>(
  type: T,
  payload: P
): MessageWithPayload<T, P>;
export function createMessage<T extends string, P>(type: T, payload?: P) {
  return payload === undefined ? { type } : { type, payload };
}
/* eslint-enable import/export */

export function isMessage(val: any): val is Message<any> {
  return typeof val === "object" && "type" in val;
}
