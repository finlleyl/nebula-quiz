package realtime

import "encoding/json"

// jsonMarshal and jsonUnmarshal wrap std json to keep call-sites clean.
func jsonMarshal(v any) ([]byte, error)   { return json.Marshal(v) }
func jsonUnmarshal(b []byte, v any) error { return json.Unmarshal(b, v) }
