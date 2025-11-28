package modinstall

// 资源类型
type ResourceType string

const (
	Tracks    ResourceType = "tracks"
	Cars      ResourceType = "cars"
	Shaders   ResourceType = "shaders"
	Dashboard ResourceType = "dashboard"
	All       ResourceType = "all"
)

// 资源状态
type ResourceState string

const (
	Pass        ResourceState = "pass"
	NotImported ResourceState = "notImported"
	Incomplete  ResourceState = "incomplete"
)
