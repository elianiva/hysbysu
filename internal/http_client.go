package internal

import (
	"io"
	"log"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"strings"
	"time"

	"github.com/pkg/errors"
)

type HttpClient struct {
	client           *http.Client
	config           Config
	cookies          []*http.Cookie
	hasMoodleSession bool
}

func NewClient(config Config) (*HttpClient, error) {
	cookieJar, err := cookiejar.New(nil)
	if err != nil {
		return nil, errors.Wrap(err, "failed to initialise http client")
	}

	client := &http.Client{
		Jar:     cookieJar,
		Timeout: time.Minute,
	}

	return &HttpClient{client: client, config: config}, nil
}

func (h *HttpClient) newRequest(method string, url string, data io.Reader) (*http.Request, error) {
	request, err := http.NewRequest(method, url, data)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create a new request")
	}

	request.Header.Set("Access-Control-Expose-Headers", "Set-Cookie")
	request.Header.Set("Sec-Fetch-Dest", "document")
	request.Header.Set("Sec-Fetch-Mode", "navigate")
	request.Header.Set("Sec-Fetch-Site", "none")
	request.Header.Set("Sec-GPC", "1")
	// request.Header.Set("Origin", h.config.SiakadUrl)
	// request.Header.Set("Referer", h.config.SiakadUrl)
	request.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36")

	for _, cookie := range h.cookies {
		// we don't want this cookie to override the actual `siakad` cookie
		isInvalidSiakadCookie := cookie.Name == "siakad" && cookie.Value == "a%3A0%3A%7B%7D"
		isDeletedPolinemaSSO := cookie.Name == "polinema_sso" && cookie.Value == "deleted"
		if isInvalidSiakadCookie || isDeletedPolinemaSSO {
			continue
		}
		request.AddCookie(cookie)
	}

	return request, nil
}

func (h *HttpClient) Get(url string, data io.Reader) (*http.Response, error) {
	request, err := h.newRequest(http.MethodGet, url, data)
	if err != nil {
		return nil, err
	}

	response, err := h.client.Do(request)
	if err != nil {
		return nil, errors.Wrap(err, "failed to perform a get request")
	}

	return response, err
}

func (h *HttpClient) postForm(url string, data url.Values) (*http.Response, error) {
	encodedData := data.Encode()
	request, err := h.newRequest(http.MethodPost, url, strings.NewReader(encodedData))
	if err != nil {
		return nil, err
	}

	request.Header.Set("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
	request.Header.Set("Accept", "application/json")
	request.Header.Set("Referer", h.config.SiakadUrl+"/login/index/err/6")
	request.Header.Set("X-Requested-With", "XMLHttpRequest")

	response, err := h.client.Do(request)
	if err != nil {
		return nil, errors.Wrap(err, "failed to perform a post form request")
	}

	return response, nil
}

func (h *HttpClient) login() error {
	credential := url.Values{
		"username": []string{h.config.NIM},
		"password": []string{h.config.Password},
	}
	response, err := h.postForm(h.config.SiakadUrl+"/login", credential)
	if err != nil {
		return errors.Wrap(err, "failed to login")
	}
	defer response.Body.Close()

	h.updateOrInsertCookie(response.Cookies())
	return nil
}

func (h *HttpClient) FetchSubjectsContent() (io.Reader, error) {
	response, err := h.Get(h.config.SlcUrl+"/spada", nil)
	if err != nil {
		return nil, err
	}
	h.updateOrInsertCookie(response.Cookies())
	return response.Body, nil
}

func (h *HttpClient) FetchLmsContent(courseUrl string) (io.Reader, error) {
	// the first firstResponse, which has a url format of `slcUrl/spada/?gotourl=xxx` is used to get the cookie needed for the lms page itself
	// the firstResponse is a <script>window.location="lmsUrl"</script>, which we do in the second request
	// not sure why they use client side redirect instead of responding with 302 status code
	firstResponse, err := h.Get(h.config.SlcUrl+"/spada/?gotourl="+url.QueryEscape(courseUrl), nil)
	if err != nil {
		return nil, err
	}
	defer firstResponse.Body.Close()
	h.updateOrInsertCookie(firstResponse.Cookies())

	// we need to get the MoodleSession first and then enter the url using that cookie
	// skip if we already have MoodleSession cookie
	if !h.hasMoodleSession {
		secondReq, _ := h.newRequest(http.MethodGet, courseUrl, nil)
		secondReq.Header.Set("Sec-Fetch-Site", "same-site")
		secondReq.Header.Set("Referer", h.config.SlcUrl)
		moodleSessionResp, err := h.client.Do(secondReq)
		if err != nil {
			return nil, err
		}
		moodleSessionResp.Body.Close()
		h.updateOrInsertCookie(moodleSessionResp.Cookies())

		// we can't simply do `h.hasMoodleSession = true` because we're not sure if it's succeeded or not
		for _, cookie := range h.cookies {
			if cookie.Name == "MoodleSession" {
				h.hasMoodleSession = true
				break
			}
		}
	}

	secondResponse, err := h.Get(courseUrl, nil)
	if err != nil {
		return nil, err
	}
	return secondResponse.Body, nil
}

func (h *HttpClient) CollectCookies() error {
	log.Println("collecting cookies...")
	if err := h.collectSiakadCookies(); err != nil {
		return err
	}

	log.Println("logging in...")
	if err := h.login(); err != nil {
		return err
	}

	log.Println("collecting homepage cookies...")
	if err := h.collectHomepageCookies(); err != nil {
		return err
	}

	log.Println("collecting slc cookies...")
	if err := h.collectSlcCookies(); err != nil {
		return err
	}

	return nil
}

func (h *HttpClient) collectSiakadCookies() error {
	response, err := h.Get(h.config.SiakadUrl, nil)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	h.updateOrInsertCookie(response.Cookies())
	return nil
}

func (h *HttpClient) collectHomepageCookies() error {
	response, err := h.Get(h.config.SiakadUrl+"/beranda", nil)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	h.updateOrInsertCookie(response.Cookies())
	return nil
}

func (h *HttpClient) collectSlcCookies() error {
	response, err := h.Get(h.config.SlcUrl, nil)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	h.updateOrInsertCookie(response.Cookies())
	return nil
}

func (h *HttpClient) ResetCookies() {
	h.cookies = []*http.Cookie{}
}

func (h *HttpClient) updateOrInsertCookie(newCookies []*http.Cookie) {
	for _, newCookie := range newCookies {
		oldIndex := -1
		for i, oldCookie := range h.cookies {
			if oldCookie.Name == newCookie.Name {
				oldIndex = i
			}
		}

		if oldIndex != -1 {
			h.cookies[oldIndex] = newCookie
		} else {
			h.cookies = append(h.cookies, newCookie)
		}
	}
}
