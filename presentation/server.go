package presentation

import (
	"encoding/json"
	"html/template"
	"hysbysu/internal"
	"hysbysu/model"
	"log"
	"net/http"
	"os"
	"path"
	"time"

	_ "embed"

	"github.com/pkg/errors"
)

type server struct {
	*http.Server
}

type SiteData struct {
	HistoryItems []model.HistoryItem
}

//go:embed pages/Index.html
var templateFile string

func getTemplate(config internal.Config) (*template.Template, error) {
	htmlTemplate, err := template.New("index").Funcs(template.FuncMap{
		"toReadableDate": func(timestamp int64) string {
			return time.UnixMilli(timestamp).In(config.TimeZone).Format("Monday, 02 February 2006 | 03:04:05")
		},
	}).Parse(templateFile)
	if err != nil {
		return &template.Template{}, errors.Wrap(err, "failed to parse index html template")
	}
	return htmlTemplate, nil
}

func NewServer(config internal.Config) (server, error) {
	htmlTemplate, err := getTemplate(config)
	if err != nil {
		return server{}, err
	}

	router := http.NewServeMux()
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		historyPath := path.Join(config.CWD, "snapshots", "history.json")
		historyFile, err := os.Open(historyPath)
		if err != nil {
			log.Println(err)
			w.WriteHeader(500)
			return
		}

		var histories []model.HistoryItem
		err = json.NewDecoder(historyFile).Decode(&histories)
		if err != nil {
			log.Println(err)
			w.WriteHeader(500)
			return
		}

		siteData := SiteData{
			HistoryItems: histories,
		}
		htmlTemplate.Execute(w, siteData)
	})

	httpServer := &http.Server{Addr: ":" + config.ServerPort, Handler: router}
	return server{httpServer}, nil
}

func (s *server) Start() error {
	return s.ListenAndServe()
}
