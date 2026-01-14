package routeshandlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

type HomeCardJSON struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Link        string `json:"link"`
	Icon        string `json:"icon"`
}

func HomeCards() gin.HandlerFunc {
	return func(c *gin.Context) {
		page := c.Param("page")
		var out []HomeCardJSON
		switch page {
		case "home":
			out = []HomeCardJSON{
				{Name: "GreenSkin", Icon: "faFeatherPointed", Description: "An Application to compute Energy Saving with Isolation", Link: "/skin/greenskinhome"},
				{Name: "Reskin", Icon: "faFeatherPointed", Description: "A European Project", Link: "/skin/redskinhome"},
				{Name: "Dialysis Diet Calculator", Icon: "faPizzaSlice", Description: "Calculate Your Main Diet components", Link: "https://www.usefulrisk.com/phosphore"},
				{Name: "How to Estimate Risk ", Icon: "faGraduationCap", Description: "Why you Cannot \"Simply\" Add or list Risks", Link: "https://www.usefulrisk.com/pythagore"},
				{Name: "Display and Compute Time Series", Icon: "faLineChart", Description: "Building Time Series Calcs", Link: "monitoring"},
				//{Name: "Energy Model Decision Support System", Icon: "faLightbulb", Description: "Energy Model Decision Support System", Link: "dss"},
				//{Name: "HEART2020 Observations Monitoring Tool", Icon: "faBuilding", Description: "Real Time Building Monitoring", Link: "monitoring"},
				{Name: "Financial Risk Analysis", Icon: "faRulerCombined", Description: "A Visual Representation of Multi Variables Risk Analysis", Link: "https://www.usefulrisk.com/uranium"},
				//{Name: "A Time Series Library for Go Language", Icon: "faGithub", Description: "Go Package timeseriesOld provides functionality for creating, manipulating and processing computations on Time Series.", Link: "https://github.com/FredFlament/timeseriesOld"},
				//{Name: "Sophisticated Time Series Library Documentation", Icon: "faSun", Description: "", Link: "pages/timeseriesdocu.html"},
			}
		case "redskin":
			out = []HomeCardJSON{
				{Name: "Decision Support System", Description: "Decision Support System", Link: "/paramschoice/", Icon: "faLineChart"},
				{Name: "Hardware Management", Description: "Manufacturer", Link: "/reskinhardware/", Icon: "faIndustry"},
				{Name: "Tenants Management", Description: "Tenants Management", Link: "/tenants/", Icon: "faCat"},
			}
		case "greenskin":
			out = []HomeCardJSON{
				{Name: "Manufacturers", Icon: "faBuilding", Description: "Manufacturers", Link: "/list/manufacturers"},
				{Name: "Buildings", Icon: "faBuilding", Description: "Building Characteristics", Link: "/list/buildings"},
				{Name: "Windows", Icon: "faPersonThroughWindow", Description: "Windows Technologies", Link: "/list/windows"},
				{Name: "Residences", Icon: "faPaintRoller", Description: "Green Residences", Link: "/list/residences/"},
				{Name: "Walls", Icon: "faPaintRoller", Description: "Wall Insulation Technologies", Link: "/list/walls"},
				{Name: "Setup", Icon: "faCogs", Description: "Devices", Link: "devices"},
				{Name: "Weather Data", Icon: "faCloudSunRain", Description: "Weather Data", Link: "/list/meteo"},
				{Name: "Design Scenarios", Icon: "faScrewdriverWrench", Description: "Setup a Simulation", Link: "/itemselection"},
				{Name: "UI Factory", Icon: "faFlaskVial", Description: "User Interfaces Factory", Link: "/list/topics"},
				{Name: "Test Topic", Icon: "faFlaskVial", Description: "User Interfaces Factory", Link: "/list/testtopic"},
				{Name: "Create Field", Icon: "faFlaskVial", Description: "User Interfaces Factory", Link: "/FormItemFactoryStandalone"},
			}
		case "reskinhardware":
			out = []HomeCardJSON{
				{Name: "Manufacturers", Icon: "faBuilding", Description: "Manufacturers", Link: "/list/manufacturers"},
				{Name: "Buildings", Icon: "faBuilding", Description: "Building Characteristics", Link: "/list/buildings"},
				{Name: "Setup", Icon: "faCogs", Description: "Devices", Link: "devices"},
				{Name: "Weather Data", Icon: "faCloudSunRain", Description: "Weather Data", Link: "/list/meteo"},
				{Name: "Design Scenarios", Icon: "faScrewdriverWrench", Description: "Setup a Simulation", Link: "/itemselection"},
			}
		case "remotedatalive":
			out = []HomeCardJSON{
				{Name: "Dashboard", Icon: "faGauge", Description: "Live Devices Report", Link: "/reportlasts"},
				{Name: "Remote", Icon: "faBuilding", Description: "Daily All Datasources for One Device", Link: "/devicesoptic"},
				{Name: "Details", Icon: "faLineChart", Description: "Details, Clean, Regularize and Polish Time Series", Link: "/remotedata"},
				{Name: "Simulation", Icon: "faCogs", Description: "Simulate, Details and Polish Time Series", Link: "/simul"},
			}
		default:
			out = []HomeCardJSON{}
		}
		c.JSON(http.StatusOK, out)
	}
}
