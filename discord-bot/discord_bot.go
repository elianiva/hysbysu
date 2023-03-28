package main

import (
	"fmt"
	"github.com/bwmarrin/discordgo"
	"github.com/pkg/errors"
	"hysbysu_discord_bot/models"
	"log"
	"time"
)

type discordBot struct {
	discord   *discordgo.Session
	channelId string
}

func NewDiscordBot(token, channelId string) (*discordBot, error) {
	discord, err := discordgo.New("Bot " + token)
	if err != nil {
		return nil, err
	}
	discord.Identify.Intents = discordgo.IntentGuildMessages
	err = discord.Open()
	if err != nil {
		return nil, err
	}

	return &discordBot{discord, channelId}, nil
}

func (bot *discordBot) SendInfo(message string) error {
	_, err := bot.discord.ChannelMessageSend(bot.channelId, message)
	if err != nil {
		return errors.Wrap(err, "failed to send message to discord")
	}
	return nil
}

func (bot *discordBot) SendError(message string) error {
	embed := &discordgo.MessageEmbed{
		Title:       "❗ Ada yg error bang",
		Color:       0xf54242,
		Description: "```\n" + message + "\n```",
		Timestamp:   time.Now().Format(time.RFC3339),
		Footer: &discordgo.MessageEmbedFooter{
			Text: "tolong mention @elianiva kalo orangnya belom ngerespon",
		},
	}

	_, err := bot.discord.ChannelMessageSendEmbed(bot.channelId, embed)
	if err != nil {
		return errors.Wrap(err, "failed to log error message to discord")
	}

	return nil
}

func (bot *discordBot) buildLectureList(lectures []models.Lecture, lectureType models.LectureType) string {
	output := ""
	for _, lecture := range lectures {
		if lecture.Type == lectureType {
			output += fmt.Sprintf("• [%s](%s)", lecture.Name, lecture.Url)
		}
	}
	return output
}

func (bot *discordBot) SendNotification(subject models.Subject) error {
	for _, meeting := range subject.Meetings {
		embed := &discordgo.MessageEmbed{
			Title: "📚 Inpo tugas!!",
			Author: &discordgo.MessageEmbedAuthor{
				Name:    subject.Lecturer.Name,
				IconURL: "https://twirpz.files.wordpress.com/2015/06/twitter-avi-gender-balanced-figure.png",
				// TODO(elianiva): figure out why the image won't load on discord
				// IconURL: subject.Lecturer.ImageUrl,
			},
			Color: 0x61afef,
			Fields: []*discordgo.MessageEmbedField{
				{Name: "Title", Value: meeting.Title},
				{Name: "Subject", Value: meeting.Subject},
			},
			Thumbnail: &discordgo.MessageEmbedThumbnail{
				URL: "https://media.discordapp.net/attachments/1034341084735754260/1034370197429157888/unknown.png",
			},
			Timestamp: time.Now().Format(time.RFC3339),
			Footer: &discordgo.MessageEmbedFooter{
				Text: "kalo ada tugas buru dikerjain, gausah ditunda tunda",
			},
		}

		assignments := bot.buildLectureList(meeting.Lectures, models.LectureAssignment)
		if len(assignments) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "Assignments",
				Value: assignments,
			})
		}

		resources := bot.buildLectureList(meeting.Lectures, models.LectureResource)
		if len(resources) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "Resources",
				Value: resources,
			})
		}

		quizzes := bot.buildLectureList(meeting.Lectures, models.LectureQuiz)
		if len(quizzes) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "Quizzes",
				Value: quizzes,
			})
		}

		forums := bot.buildLectureList(meeting.Lectures, models.LectureForum)
		if len(forums) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "Forums",
				Value: forums,
			})
		}

		externalResource := bot.buildLectureList(meeting.Lectures, models.LectureUrl)
		if len(externalResource) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "External Resources",
				Value: externalResource,
			})
		}

		uncategorised := bot.buildLectureList(meeting.Lectures, models.LectureUnknown)
		if len(uncategorised) > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "Uncategorised",
				Value: uncategorised,
			})
		}

		log.Println("sending message to " + bot.channelId)
		_, err := bot.discord.ChannelMessageSendEmbed(bot.channelId, embed)
		if err != nil {
			return errors.Wrap(err, "failed to send message to discord")
		}
	}

	return nil
}
