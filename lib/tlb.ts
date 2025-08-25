import { parseTLB, replacer } from '@ton-community/tlb-runtime';

export interface TLBResult {
  success: boolean;
  data?: string;
  error?: string;
}

/**
 * Encode JSON data to BoC base64 using TLB schema
 */
export function encodeToBoC(jsonData: string): TLBResult {
  try {
    const data = JSON.parse(jsonData);

    const schema = `nothing$0 {X:Type} = Maybe X;
just$1 {X:Type} value:X = Maybe X;
var_uint$_ {n:#} len:(#< n) value:(uint (len * 8)) = VarUInteger n;
addr_none$00 = MsgAddressExt;
addr_extern$01 len:(## 9) external_address:(bits len) = MsgAddressExt;
anycast_info$_ depth:(#<= 30) { depth >= 1 } rewrite_pfx:(bits depth) = Anycast;
addr_std$10 anycast:(Maybe Anycast) workchain_id:int8 address:bits256  = MsgAddressInt;
addr_var$11 anycast:(Maybe Anycast) addr_len:(## 9) workchain_id:int32 address:(bits addr_len) = MsgAddressInt;
_ _:MsgAddressInt = MsgAddress;
_ _:MsgAddressExt = MsgAddress;
burn#595f07bc
 query_id:uint64
 amount:(VarUInteger 16)
 response_destination:MsgAddress
 custom_payload:(Maybe ^Cell)
 = InternalMsgBody;`;

    const runtime = parseTLB(schema);
    const serialized = runtime.serialize(data);
    if (!serialized.success) {
      return { success: false, error: serialized.error?.message ?? 'Serialization failed' };
    }
    const bocBase64 = serialized.value.endCell().toBoc().toString('base64');
    return { success: true, data: bocBase64 };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Decode BoC base64 to JSON using TLB schema
 */
export function decodeFromBoC(boc: string): TLBResult {
  try {
    if (!boc.trim()) {
      return { success: false, error: 'BoC base64 or hex string is required' };
    }

    const schema = `nothing$0 {X:Type} = Maybe X;
just$1 {X:Type} value:X = Maybe X;
var_uint$_ {n:#} len:(#< n) value:(uint (len * 8)) = VarUInteger n;
addr_none$00 = MsgAddressExt;
addr_extern$01 len:(## 9) external_address:(bits len) = MsgAddressExt;
anycast_info$_ depth:(#<= 30) { depth >= 1 } rewrite_pfx:(bits depth) = Anycast;
addr_std$10 anycast:(Maybe Anycast) workchain_id:int8 address:bits256  = MsgAddressInt;
addr_var$11 anycast:(Maybe Anycast) addr_len:(## 9) workchain_id:int32 address:(bits addr_len) = MsgAddressInt;
_ _:MsgAddressInt = MsgAddress;
_ _:MsgAddressExt = MsgAddress;
burn#595f07bc
 query_id:uint64
 amount:(VarUInteger 16)
 response_destination:MsgAddress
 custom_payload:(Maybe ^Cell)
 = InternalMsgBody;`;

    const runtime = parseTLB(schema);
    const deserialized = runtime.deserialize(boc);
    if (!deserialized.success) {
      return { success: false, error: deserialized.error?.message ?? 'Deserialization failed' };
    }
    const jsonString = JSON.stringify(deserialized.value, replacer, 2);
    return { success: true, data: jsonString };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get example JSON data for testing
 */
export function getExampleJSON(): string {
  return JSON.stringify({
    kind: 'InternalMsgBody',
    query_id: 0,
    amount: '1',
    response_destination: 'Ef8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAU',
    custom_payload: { kind: 'Maybe_nothing' }
  }, null, 2);
}

/**
 * Get example BoC base64 for testing
 */
export function getExampleBoC(): string {
  return 'te6cckEBAQEAMQAAXllfB7wAAAAAAAAAABKp/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4/EP1Q==';
}
