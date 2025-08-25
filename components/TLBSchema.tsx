import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

export default function TLBSchema() {
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

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>TLB Schema</ThemedText>
      <ScrollView style={styles.schemaContainer}>
        <ThemedText style={styles.schemaText}>{schema}</ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: 'bold',
  },
  schemaContainer: {
    maxHeight: 200,
  },
  schemaText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
});
